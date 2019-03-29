#!/bin/bash

trap "exit" INT

# start telegraf
printenv | grep JOBMONITOR | sudo tee /etc/default/telegraf
sudo service telegraf start

# move to code directory if any
OUTPUT_FILE="/dev/null"
if [ -d "$JOBMONITOR_DIRECTORY" ]; then
  cd "$JOBMONITOR_DIRECTORY"
  OUTPUT_FILE="$JOBMONITOR_DIRECTORY/../output/output.txt"
fi

# run the command in a tmux session
echo "Create new tmux session and run command."
tmux new -d "$@" \; pipe-pane "cat > $OUTPUT_FILE"

# keep container alive until all tmux sessions are killed
echo "Wait for tmux sessions to be finished."
RET=0
while [ ${RET} -eq 0 ]; do
    tmux ls
    RET=$?
    sleep 10
done
