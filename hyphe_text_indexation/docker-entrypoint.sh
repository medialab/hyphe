#!/bin/bash
cd /hyphe_text_indexation

echo
echo " ~"
echo " ~ Install dependences"
echo " ~"
echo
bash ./install_deps.sh

echo
echo " ~"
echo " ~ Run python script"
echo " ~"
echo
python text_indexation.py

