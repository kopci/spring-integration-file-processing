package sk.kopci.springintegration.fileprocessing.services.dtos;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.kopci.springintegration.fileprocessing.utils.LocalDateTimeDeserializer;
import sk.kopci.springintegration.fileprocessing.utils.LocalDateTimeSerializer;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FilterDto {

    private FilterValues values;
    private String sort;
    private int page;
    private int resultsPerPage;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public class FilterValues {

        private String string1;
        private String string2;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        private LocalDateTime from;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        private LocalDateTime to;

        public boolean areEmpty() {
            if (string1 == null && string2 == null && from == null && to == null)
                return true;
            return false;
        }

    }

}
