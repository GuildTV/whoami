# WhoAmI

WhoAmI is a simple HTML and nodejs based template for CasparCG designed to identify each of the output channels for one or many servers.

It presents a basic set of information about the output channel, and plays a 1khz lineup tone to ensure that audio is correct.

![sample](doc/sample1.png)

### Usage
This must be run on the CasparCG machine, and requires nodejs to be installed.
Run install.bat to install the node dependencies before first run.
Run start.bat to start the server and run the template on all configured channels.
To clear the template, simply Ctrl-C to terminate the application.

Note: You can also naviate to http://127.0.0.1:3030 (replace 127.0.0.1 with the ip of the caspar machine if accessing from another pc) to view the information for all channels in one place.