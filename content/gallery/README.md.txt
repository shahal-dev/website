Adding a photo to the gallery
=============================

1. Process the image (one upload → three versions + metadata.json):

     pnpm photo ~/Pictures/M31-final.tif M31

   creates public/photos/M31/
     thumb.webp    400 px    grid tiles
     medium.webp  1600 px    detail page + carousel
     full.jpg     full res   "open full resolution"
     metadata.json           dimensions, byte sizes, EXIF if the file carries any

   Extra frames of the same object (mosaic panels, a second processing,
   a closer crop) go into numbered slots:

     pnpm photo ~/Pictures/M31-Ha.tif M31 --slot 2

   A professional comparison frame (Hubble, JWST, a survey image):

     pnpm photo ~/Downloads/hubble-m31.jpg M31 --reference

2. Write the entry: content/gallery/andromeda-galaxy.md
   The filename becomes the URL — /gallery/andromeda-galaxy.

   ---
   title: "Andromeda Galaxy (M31)"
   description: "Our nearest large neighbour, 2.5 million light-years away."
   object: "M31"
   tag: "Galaxy"
   folder: /photos/M31
   alt: "The Andromeda Galaxy photographed by Shahal"
   featured: true
   date: "2026-01-14"
   location: "Sajek Valley, Bangladesh"
   frames:
     - folder: /photos/M31/2
       caption: "Hydrogen-alpha pass on the same field."
   gear:
     telescope: "Askar FMA180 Pro"
     camera: "ZWO ASI533MC Pro"
     mount: "Sky-Watcher Star Adventurer GTi"
     filters: "Optolong L-Pro"
   acquisition:
     exposures: "120 × 90 s"
     integration: "3 h"
     sky: "Bortle 4"
   reference:
     src: /photos/M31/reference.webp
     label: "Hubble"
     credit: "NASA, ESA and the Hubble Heritage Team (STScI/AURA)"
     url: "https://hubblesite.org/"
   ---

   Everything below the frontmatter is Markdown/MDX — headings, lists, links,
   images, and any Vue component registered in app/components. For example:

     ![The field before processing](/photos/M31/2/medium.webp)

     ::callout
     Shot over three nights, with the last one lost to cloud.
     ::

   What renders where:
   - frames        → carousel under the title (main frame first)
   - gear +
     acquisition
     + date/location → spec table above the text
   - reference     → drag-to-wipe comparison slider below the text
   - anything you
     omit          → simply doesn't render

3. Commit the files in public/photos/ along with the markdown. They are static
   assets served straight from the site.
