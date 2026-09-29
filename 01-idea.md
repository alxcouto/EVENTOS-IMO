

# EVENTOS-IMO: PLATFORM IDEA

- We need a platform to host "EVENTOS-IMO" live events.

- The platform "EVENTOS-IMO" will be an index landing page linking to all event pages.

- We already have this platform for one specific event "26-09-30_BeLight". In the future we will have more events and we will need to add them to the index page.

- At this moment it will be a simple index to link to the event pages.



    
# BE-LIGHT: EVENT PAGE

- Implements the client found at "Projects/Live-Speech-MLX-TX/02-08-EnbededWebClient_Matomo/YoutubeSupabaseMatomo_Client".

- Use "Projects/EVENTOS-IMO/26-09-30_BeLight/config.json" to configure the supabase credentials and youtube broadcast id for the client.



# SERVER / HOSTING:

- Create a new project in Railway for the platform "EVENTOS-IMO".
- Each event must be stored into a diferent sub-folder in the project.
- The GitHub repository for the project should be named "EVENTOS-IMO" and follow the same folder/sub-folder structure.

For example:

Railway project "EVENTOS-IMO":
    
    26-09-30_BeLight/
        config.json
        embed.js
        Client/
            index.html
            script.js
            style.css    
        

# Local Repository Backups:

- In the folder "Projects/EVENTOS-IMO" will be the back-up of all the railway project. Keep it updated.


# DESIGN DECISIONS & BRANDING:

- **Style & Aesthetic**: Minimalist, clean clinical design inspired by "www.miranza.es" (deep navy `#002D62`, clinical blue `#00669D`, Miranza accent green `#73cf91`, soft light background `#F7F9FA`, elegant card typography, crisp badges).
- **Routing Engine**: Internal rewrite. Requesting an event URL such as `/26-09-30_BeLight/` internally serves `/26-09-30_BeLight/Client/index.html` without changing the URL in the browser bar, preserving session query parameters (`?session=session_1`).


# FUTURE ROADMAP: NEW EVENT WIZARD

- As a future enhancement, provide a "New Event Wizard" accessible from the "EVENTOS-IMO" landing page.
- **Wizard Capabilities**:
  - Prompt the administrator for event metadata (Event Name, Date, Slug/Folder name, Description).
  - Accept or upload a `config.json` file containing Supabase credentials and YouTube session broadcast IDs.
  - Automatically scaffold the event sub-folder (`YY-MM-DD_EventName/`) with template `embed.js` and `Client/` assets.
  - Automatically register the new event into the platform landing page index.


        

