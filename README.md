# Spring Integration: File processing

### Description

The application uses Spring Integration to retrieve files from pre-configured directories and sends them 
to the required processors. Initial integration flows are configured in `FileProcessingConfig`,
currently only with `PdfProcessor` implemented. After processing files are moved from `source` to `target`
directory, backup is handled in `FileProcessingBackup`.

### Configuration

Application is configurable via `application.properties`.

| Property | Description                                         |
|----------|-----------------------------------------------------|
| `app-config.files.source`  | Source directory from which the files are retrieved |
| `app-config.files.source`   | Target directory for backup files                   |
| `app-config.poller-delay.milliseconds` | Poller delay (interval)                             |

### Database

Application is using H2 file-based database. Database is created on startup in `/db/demo.mv.db` with
`processed_files` table - this setting can be configured in `application.properties`. 

| Property | Description                                          |
|----------|------------------------------------------------------|
| `spring.jpa.hibernate.ddl-auto=update` | Database schema gets updated based on Entity classes |

***Note:** use **ddl-auto** only for development/testing.*

### UI

Client-side application is created using Thymeleaf with **Total.js** SPA library and components.
It gets job done really easy and quickly.

More: https://docs.totaljs.com/components/