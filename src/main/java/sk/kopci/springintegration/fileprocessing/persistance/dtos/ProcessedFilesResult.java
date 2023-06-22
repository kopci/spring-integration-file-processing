package sk.kopci.springintegration.fileprocessing.persistance.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.kopci.springintegration.fileprocessing.persistance.ProcessedFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedFilesResult {

    private List<ProcessedFile> files;
    private Long count;

}
