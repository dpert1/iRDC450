# NE450-iRDC

Interactive Reference Data Card for NE450

General workflow to create it:
Take the RDC image as an svg and add named boxes to it in inkscape which are invisible but callable by html.
The main page is the index.html (static website) which creates the clickable areas you drew in step 1 by their name you used in step 1.
Those clickable areas call the RDC equation description and an orientation (left right middle) based on position in the RDC.
Then when you click on a box, it makes the little callout from the RDC equation description html.

