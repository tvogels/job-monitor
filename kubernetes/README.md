# Launch the whole stack on Kubernetes:

1. If you want to use your own `graphql` or `frontend` container, you should upload it to the [EPFL Container Registry](http://ic-registry.epfl.ch) first.
   You can use the folders `/frontend` and `/graphql` in this repository as an example, and use `$(dir)/publish.sh` to upload (after modifying those files)

2. You need a storage volume for the `metadata` and `timeseries` databases. Request those with ICIT support (support-icit@epfl.ch), and then fill in `kustomization-storage-patch.yaml`.

3. Configure the application by adapting `kustomization*.yaml`.

4. Run `kubectl apply -k kubernetes` to deploy. (requires kubectl >= 1.14)
