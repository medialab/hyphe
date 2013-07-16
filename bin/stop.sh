#!/bin/bash


kill $(cat twistd.pid)
sleep 1
kill $(cat java-memstruct.pid)

