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

### UI

*To be implemented.*