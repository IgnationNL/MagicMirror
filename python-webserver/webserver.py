import SimpleHTTPServer
import SocketServer

class MyRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):

    def do_GET(self):

        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()

        if (self.path == "/startActivityIndicator"):
            startActivityIndicator() # Start activity indicator animation
            self.wfile.write("OK")
        elif (self.path == "/endActivityIndicator"):
            endActivityIndicator() # Stop activity indicator animation
            self.wfile.write("OK")
        elif (self.path == "/startFocusAnimation"):
            startFocusAnimation() # Start the focus animation
            self.wfile.write("OK")
        elif (self.path == "/stopFocusAnimation"):
            stopFocusAnimation() # Stop the focus animation
            self.wfile.write("OK")
        elif (self.path == "/confirmed"):
            confirmed() # Show solid green light for 4 seconds, then fade.
            self.wfile.write("OK")
        elif (self.path == "/error"):
            error() # Show solid red light for 4 seconds, then fade.
            self.wfile.write("OK")
        elif (self.path == "/inputRequired"):
            inputRequired() # Show solid blue light
            self.wfile.write("OK")
        else:
            self.wfile.write("UNKNOWN")

Handler = MyRequestHandler
server = SocketServer.TCPServer(('0.0.0.0', 8008), Handler)

server.serve_forever()
