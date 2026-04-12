FROM ubuntu/bind9:latest

COPY named.conf.options /etc/bind/named.conf.options
COPY named.conf.local   /etc/bind/named.conf.local
COPY zones/             /etc/bind/zones/

EXPOSE 53/udp
EXPOSE 53/tcp
