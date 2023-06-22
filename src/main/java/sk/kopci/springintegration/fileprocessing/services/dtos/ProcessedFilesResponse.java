package sk.kopci.springintegration.fileprocessing.services.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.kopci.springintegration.fileprocessing.persistance.ProcessedFile;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProcessedFilesResponse {

    /*
    Names of following attributes are mapped for client-side data table component (by its design).
    Change of attribute names could lead to non-functional UI.
     */

    private List<ProcessedFile> items;
    private long count;
    private int pages;
    private int page;

}
