# Model

Currently we're keeping some "sources of truth" in style elements, e.g. whether the grid has outer border. I can't remember why, and wonder if the rule should be that we store nothing in `style` attributes, only data-\* attributes.

# UI

Should be showing faint lines at all times that you see if the borders are hidden.

Feeling like there is too much text, eager to move to icon buttons with good tooltips.

Select Parent Cell: should this mean anything if you're not in an embedded grid? I was in a simple table and found myself expecting it to select the table.

I think InDesign has a "Split Cell" feature. We'd implement that with a sub-grid I guess, might be a good UX.

# Control of individual edges

Probably have to a) select what you want to change and b) set the properties. (Word has a thing where you select what you want then go "painting" it where you want it).
