#!/bin/bash
#
# Starts AZTKNanny, then starts aztk
#

echo "Starting AZTKNanny..."
export PYTHONPATH=$PYTHONPATH:/zoto/aztk;
if [ -x /zoto/aztk/bin/aztk_nanny ]
then
        (/usr/bin/env python -u /zoto/aztk/bin/aztk_nanny nanny < /dev/null >> /zoto/aztk/log/nanny-`hostname`.log 2>&1 &)
        echo "Done"
else
        echo "/zoto/aztk/bin/aztk_nanny must be executable."
fi
