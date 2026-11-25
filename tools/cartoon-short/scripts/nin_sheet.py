import sys
from PIL import Image
out=sys.argv[1]; files=sys.argv[2:]
ims=[Image.open(f).convert("RGB") for f in files]
w,h=ims[0].size; sc=0.62; tw,th=int(w*sc),int(h*sc)
cols=min(len(ims),5); rows=(len(ims)+cols-1)//cols
sheet=Image.new("RGB",(cols*tw,rows*th),(20,20,20))
for i,im in enumerate(ims): sheet.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
sheet.save(out,quality=85)
