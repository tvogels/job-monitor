for directory in metadata timeseries graphql frontend; do
  pushd $directory
  ./publish.sh
  popd > /dev/null
done
