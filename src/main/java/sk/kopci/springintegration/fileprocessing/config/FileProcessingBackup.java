package sk.kopci.springintegration.fileprocessing.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.Transformer;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.handler.LoggingHandler;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import sk.kopci.springintegration.fileprocessing.utils.FileTypes;
import sk.kopci.springintegration.fileprocessing.utils.Messages;

import java.io.File;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class FileProcessingBackup {

    public static final String FILE_EXTENSION_PROCESSED = "_processed";
    public static final String FILE_EXTENSION_ERROR = "_error";

    private List<String> needsXmlBackup = Arrays.asList(
            FileTypes.METADATA_PDF.getValue()
    );

    @Bean
    public IntegrationFlow backupFile() {
        return f -> f
                .log(LoggingHandler.Level.INFO, Messages.BACKUP_STARTED, "payload.getName")
                .filter("headers.processedCorrectly", c -> c.discardChannel("backupError.input"))
                .channel("backupProcessed.input");
    }

    @Bean
    public IntegrationFlow backupProcessed() {
        return f -> f.handle(this, "renameToProcessed");
    }

    @Bean
    public IntegrationFlow backupError() {
        return f -> f.handle(this, "renameToError");
    }

    @Transformer
    public void renameToProcessed(@Payload File file, @Header("targetPath") String targetPath, @Header("sourcePath") String sourcePath,
                               @Header("fileType") String fileType) {
        backup(
                file,
                targetPath,
                sourcePath,
                fileType,
                FILE_EXTENSION_PROCESSED
        );
    }

    @Transformer
    public void renameToError(@Payload File file, @Header("targetPath") String targetPath, @Header("sourcePath") String sourcePath,
                                @Header("fileType") String fileType) {
        backup(
                file,
                targetPath,
                sourcePath,
                fileType,
                FILE_EXTENSION_ERROR
        );
    }
    private void backup(File file,  String targetPath, String sourcePath, String fileType, String ext) {
        String newPath = String.format("%s/%s", targetPath, file.getName() + ext);

        // check if already file exists in target dir, prevents loop
        File duplicate = new File(newPath);
        if (duplicate.exists())
            duplicate.delete();

        File backup = new File(newPath);
        file.renameTo(backup);

        log.info(Messages.BACKUP_COMPLETED);
    }



}
