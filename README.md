<a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>

# Spectro Cloud Deploy Kubernetes

<p align="left">
<img alt="Spectro Cloud" src="./spectrocloud-logo.png" height="100" />
</p>

This action can be used to deploy a new Kubernetes cluster on public, private, and bare-metal environments.

## Action inputs

<table>
  <thead>
    <tr>
      <th>Action inputs</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td><code>host</code><br/>Host</td>
    <td>(Optional) Spectro Cloud API endpoint. Default points to the Spectro Cloud SaaS endpoint: api.spectrocloud.com</td>
  </tr>
  <tr>
    <td><code>username</code><br/>Username</td>
    <td>Spectro Cloud Username (e.g: user1@abc.com)</td>
  </tr>
  <tr>
    <td><code>password</code><br/>Password</td>
    <td>Spectro Cloud Password (e.g: superSecure1#)</td>
  </tr>
  <tr>
    <td><code>clusterTemplate</code><br/>Cluster Template</td>
    <td>The cluster template definitition. Look at the samples for format with each cloud</td>
  </tr>
  <tr>
    <td><code>clusterNamePrefix</code><br/>Cluster Name Prefix</td>
    <td>(Optional) Prefix of the cluster name</td>
  </tr>
  <tr>
    <td><code>deletePostJob</code><br/>Delete Post Job</td>
    <td>(Optional) Delete the cluster after GitHub job completes</td>
  </tr>
</table>

## Example usage

```yaml
- uses: spectrocloud/k8s-deploy-cluster@v1
  with:
    host: {enter Spectro Cloud API Endpoint (optional)}
    username: {enter user's Spectro Cloud Username}
    password: {enter user's Spectro Cloud Password}
    projectName: {enter Spectro Cloud Project Name}
    deletePostJob: {enter true/false depending on whether to delete the cluster after job}
    clusterNamePrefix: {enter name prefix}
    clusterTemplate: {enter template config (see examples)}
  id: deploycluster
```

**Please note** that all input except `host` are required.


## Support

Refer to the [Spectro Cloud Documentation](https://docs.spectrocloud.com) for more information on how to
retrieve the required properties.

Please file a GitHub issue for any support or questions regarding the integration.
