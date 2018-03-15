# dev.supremenewyork.com
A simple express server for making Supreme bots that pretty much tries to mimic how totally effed up supreme's servers will be at drop time.
possibly useful if you are trying to create a bot and don't want to ban yourself from the real site.
checkout isn't supported for now.

to get it installed (after you make sure you have Node installed)

```npm install```

edit your /etc/hosts file to loopback dev.supremenewyork.com to local

```127.0.0.1 dev.supremenewyork.com```

run the server

```nodemon app```

terminal will tell you where it's running, but it should now be:
http://dev.supremenewyork.com:3000

settings will be available at:
http://dev.supremenewyork.com:3000/settings/

point your shiny new bot at that url instead of the real deal.

have fun!


