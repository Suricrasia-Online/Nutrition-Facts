### nutrition facts - blackle / suricrasia online ###
BLACK LIVES MATTER - TRANS RIGHTS ARE HUMAN RIGHTS

nutrition facts is a 4k exegfx for 64-bit linux, specifically targeting Ubuntu 18.10

Packages needed (all of these are installed by default):

libglib2.0-0
libgtk-3-0
librsvg2-2
libcairo2
and whatever package gives you libgl (depends on graphics card)

Two versions of the demo are distributed. nutrition_facts is the size optimized, packed version. nutrition_facts_unpacked is the unpacked version that is missing some heavy size optimizations.

This exegfx renders an image with a resolution of 1920x1080. On smaller screens it will be clipped, and on larger screens it will be rendered in the corner.

Exit at any moment with "esc" or with your window manager's "close window" key combo. It may take 3-5 seconds for it to open a window, since it is decompressing.

You can set the number of samples with the environment variable SAMPLES:

env SAMPLES=300 ./nutrition_facts

The default number of samples is 300. It takes about 10 seconds to render on a 1660 Ti. You can also run in a 1920x1080p window, instead of going fullscreen:

env WINDOWED=1 ./nutrition_facts

Also just for fun, you can change the colour of the can's label by passing in a 6-digit hex code:

env CAN_COLOR=7C4CAD ./nutrition_facts
