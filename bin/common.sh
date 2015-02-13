exitAndLog() {
  echo
  echo "ERROR while $2"
  echo
  if [ "$1" != /dev/null ]; then 
    echo "---------------------"
    echo "Read $1 to find out what happened"
    echo
  fi
  exit 1
}

isCentOS() {
  if cat /etc/issue 2> /dev/null | grep -i "debian\|ubuntu" > /dev/null; then
    return 1
  fi
  return 0
}

isDebian() {
  version=`cat /etc/issue | sed 's/[^0-9.]//g' | awk -F "." '{print $1$2}'`
  if cat /etc/issue 2> /dev/null | grep -i "debian" > /dev/null; then
    return 0
  elif cat /etc/issue 2> /dev/null | grep -i "ubuntu" > /dev/null && [ "$version" -lt 910 ]; then
    return 0
  fi
  return 1
}
