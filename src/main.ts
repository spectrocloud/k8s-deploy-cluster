import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'
import * as core from '@actions/core'

import Client from './client'

interface Credentials {
  host: string;
  username: string;
  password: string;
}

const existingClusterUid = process.env['STATE_clusterUid'] as string

// TODO handle wrong credentials
export async function getKubeconfigFromSpectroCloud(cred: Credentials, projectName: string, clusterName: string) {
  const c = new Client(cred.host, cred.username, cred.password);
  const projectUid = await c.getProjectUID(projectName);
  const clusterUid = await c.getClusterUID(projectUid, clusterName);
  const kubeconfig = await c.getClusterKubeconfig(projectUid, clusterUid);
  return kubeconfig;
}

function DelayPromise(delayTime: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, delayTime));
}

async function waitForState<T>(
  operation: (attempt: number) => Promise<T>,
  targetState: T,
  pendingStates: T[],
  attempts: number,
  delayMs: number,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const state = await operation(i);
    if (state === targetState) {
      return state;
    } else if (!pendingStates.includes(state)) {
      throw new Error(`Invalid state ${state}`);
    }
    if (i % 5 === 0) {
      console.log(`State is ${state}`);
    }
    await DelayPromise(delayMs);
  }
  throw new Error('Timeout');
}

function getClusterStateFunc(c: Client, projectUid: string, clusterUid: string) {
  return async (attempt: number) => {
    const cluster = await c.getCluster(projectUid, clusterUid);
    const state = cluster.status.state;

    return state;
  };

}
export async function deployCluster(cred: Credentials, clusterTemplate: string, clusterName: string) {

  const cluster = yaml.load(clusterTemplate) as any

  const c = new Client(cred.host, cred.username, cred.password);

  const {cloudType, projectName, labels, cloudConfig, machinePools} = cluster;

  const projectUid = await c.getProjectUID(projectName);
  const [profileUid, cloudAccountUid] = await Promise.all([
    c.getClusterProfileUID(projectUid, cluster.clusterProfileName),
    c.getCloudAccountUID(projectUid, cloudType, cluster.cloudAccountName)
  ]);

  const mpc = function(mp: any) {
    const {
      name,
      controlPlane,
      controlPlaneAsWorker,
      count,
      config
    } = mp;


    return {
      poolConfig: {
        name,
        size: count,
        isControlPlane: controlPlane,
        isControlPlaneAsWorker: controlPlaneAsWorker,
        labels : [controlPlane ? 'master' : 'worker'],
      },
      cloudConfig : config,
    };
  };

  const data = {
    metadata: {
      name: clusterName,
      labels,
    },
    spec: {
      profileUid,
      cloudAccountUid,
      cloudConfig,
      machinePoolConfig: machinePools.map(mpc),

    }
  }

  // Debug logging:
  console.log(JSON.stringify(data, null, 2));

  const clusterUid = await c.createCluster(projectUid, cloudType, data);
  core.saveState("clusterUid", clusterUid);

  await waitForState(
    getClusterStateFunc(c, projectUid, clusterUid),
    "Running",
    ["Pending", "Provisioning", "Importing"],
    360,
    10000,
  );

  return clusterUid;
}



async function provisionCluster() {
  const credentials = {
    host: core.getInput('host'),
    username: core.getInput('username', {required : true}),
    password: core.getInput('password', {required : true}),
  }
  const clusterTemplate =  core.getInput('clusterTemplate', {required : true});

  const clusterNamePrefix =  core.getInput('clusterNamePrefix', {required : true});
  // TODO PR#, commit, etc
  const clusterName =  `cicd-${process.env.GITHUB_RUN_NUMBER}`;

  return deployCluster(credentials, clusterTemplate, clusterName);
}

export async function run() {

  // clusterNamePrefix
  // env.GITHUB_RUN_NUMBER

  let clusterId = await provisionCluster();

  // let kubeconfig = await getKubeconfig();
  // const runnerTempDirectory = (process.env['RUNNER_TEMP'] as string); // Using process.env until the core libs are updated
  // const kubeconfigPath = path.join(runnerTempDirectory, `kubeconfig_${Date.now()}`);
  // core.debug(`Writing kubeconfig contents to ${kubeconfigPath}`);
  // fs.writeFileSync(kubeconfigPath, kubeconfig);
  // fs.chmodSync(kubeconfigPath, '600');
  // core.exportVariable('KUBECONFIG', kubeconfigPath);
  // console.log('KUBECONFIG environment variable is set');
}

if (!existingClusterUid) {
  run().catch(core.setFailed);
} else {
  console.log("Post!");
}
