package sk.kopci.springintegration.fileprocessing.utils;

import lombok.Getter;

public enum FileTypes {

    PDF("pdf"),
    METADATA_PDF("metadataPdf");

    @Getter
    private final String value;

    FileTypes(String value) {
        this.value = value;
    }

}
