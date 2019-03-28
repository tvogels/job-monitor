#!/bin/bash

trap "exit" INT

# start telegraf
printenv | grep JOBMONITOR | sudo tee /etc/default/telegraf
sudo service telegraf start

# move to code directory if any
if [ -d "$JOBMONITOR_DIRECTORY" ]; then
  cd "$JOBMONITOR_DIRECTORY"
fi

# run the command in a tmux session
echo "Create new tmux session and run command."
tmux new -d "$@"

# keep container alive until all tmux sessions are killed
echo "Wait for tmux sessions to be finished."
RET=0
while [ ${RET} -eq 0 ]; do
    tmux ls
    RET=$?
    sleep 10
done
