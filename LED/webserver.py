import SimpleHTTPServer
import SocketServer
import time
import threading
from neopixel import *

# LED strip configuration:
LED_COUNT      = 60      # Number of LED pixels.
LED_PIN        = 18      # GPIO pin connected to the pixels (18 uses PWM!).
#LED_PIN        = 10      # GPIO pin connected to the pixels (10 uses SPI /dev/spidev0.0).
LED_FREQ_HZ    = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA        = 10      # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT     = False   # True to invert the signal (when using NPN transistor level shift)
LED_CHANNEL    = 0       # set to '1' for GPIOs 13, 19, 41, 45 or 53

isActivityAnimation = False
isFocusAnimation = False
isErrorAnimation = False
isConfirmAnimation = False
isInputRequired = False

focusIndex = 0

# Create NeoPixel object with appropriate configuration.
strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
# Intialize the library (must be called once before other functions).
strip.begin()

def resetAllAnimations():
    global isActivityAnimation
    global isFocusAnimation
    global isErrorAnimation
    global isConfirmAnimation
    global isInputRequired
    
    print ('reset animations')
    isActivityAnimation = False
    isFocusAnimation = False
    isErrorAnimation = False
    isConfirmAnimation = False
    isInputRequired = False    

def wheel(pos):
    """Generate rainbow colors across 0-255 positions."""
    if pos < 85:
        return Color(pos * 3, 255 - pos * 3, 0)
    elif pos < 170:
        pos -= 85
        return Color(255 - pos * 3, 0, pos * 3)
    else:
        pos -= 170
        return Color(0, pos * 3, 255 - pos * 3)

def turnOn(strip, color=30):
    """Draw rainbow that fades across all pixels at once."""
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, wheel(color))
        strip.show()

def turnOff(strip):
    """Draw rainbow that uniformly distributes itself across all pixels."""
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, 0)
        strip.show()

def setPixelColor(strip, i, color):
    strip.setPixelColor(i, wheel(color))
    strip.show()

#Animation functions
def startActivityIndicator():
   """Draw circular spinner."""
   resetAllAnimations()
   global isActivityAnimation
   isActivityAnimation = True
   
def endActivityIndicator():
   global isActivityAnimation
   if isActivityAnimation:
       isActivityAnimation = False
       turnOff(strip)

def startFocusAnimation():
    resetAllAnimations()
    global isFocusAnimation
    isFocusAnimation = True

def endFocusAnimation():
    global isFocusAnimation
    if isFocusAnimation:
        isFocusAnimation = False
        turnOff(strip)

def confirmed():
    resetAllAnimations()
    global isConfirmAnimation
    isConfirmAnimation = True
    turnOn(strip, 30)
    threading.Timer(4, endConfirmAnimation).start()

def endConfirmAnimation():
    global isConfirmAnimation
    if isConfirmAnimation:
        isConfirmAnimation = False
        turnOff(strip)

def error():
    resetAllAnimations()
    global isErrorAnimation
    isErrorAnimation = True
    turnOn(strip, 10)
    threading.Timer(4, endErrorAnimation).start()

def endErrorAnimation():
    global isErrorAnimation
    if isErrorAnimation:
        isErrorAnimation = False
        turnOff(strip)
        inputRequired()
        
def inputRequired():
    resetAllAnimations()
    global isInputRequired
    isInputRequired = True
    turnOn(strip, 120)

def doAnimation():
    global isActivityAnimation
    global isFocusAnimation
    global isErrorAnimation
    global isConfirmAnimation
    global isInputRequired

    global focusIndex

    threading.Timer(0.1, doAnimation).start()
    millis = int(round(time.time() * 1000))
    
    if isActivityAnimation:
        turnOff(strip)
        setPixelColor(strip, millis / 100 % LED_COUNT, 200)

    elif isFocusAnimation:        
        setPixelColor(strip, focusIndex, 30)
        setPixelColor(strip, LED_COUNT - focusIndex, 30)
        focusIndex = focusIndex + 1
        if (focusIndex >= LED_COUNT / 2):
            focusIndex = 0
            turnOff(strip)
        

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

threading.Timer(0.1, doAnimation).start()
Handler = MyRequestHandler
server = SocketServer.TCPServer(('0.0.0.0', 8001), Handler)

server.serve_forever()



