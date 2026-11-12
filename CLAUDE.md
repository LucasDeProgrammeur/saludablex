# Design patterns for web projects

## Frontend
### Tech stack
- Make use of ReactJS, with Vite and Typescript
- For routing, use React Router, with declarative routing
- Make use of tanstack query if the webapp has to load in a lot of data from another source and it needs to be managed

### Folder structure
- components: where all the components lie. Their CSS files should live in the same folder
- pages: a page itself, with all the non-reusable parts.
- helpers: helper functions
- types: where all types and interfaces lie that we created
- data: for any data instructions

### Styling
- There should be one `index.css` file, where general information is stored (e.g. for button, h1, h2, input)
- On top of the file is the :root class, where reusable variables are set
    - The reusable variables are: default-spacing, default-radius, main-color, secondary-color, tertiary-color, color-warning, color-error, color-info
    - The default spacings should be divisible by three
- CSS classnames should be in dashes (.hero-image) for example
- Avoid media queries where possible and make use of min() instead.
- Components get their own .css file and are stored in the components folder so that it is easy for the developer to navigate around and make changes

### Into production
The projects I make will end up on my VPS, with a reverse proxy to a subdomain. The site is statically generated.
