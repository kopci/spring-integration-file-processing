package sk.kopci.springintegration.fileprocessing.persistance;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.kopci.springintegration.fileprocessing.utils.LocalDateTimeConverter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "processed_files")
public class ProcessedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "string1")
    private String string1;

    @Column(name = "string2")
    private String string2;

    @Column(name = "date1")
    @Convert(converter = LocalDateTimeConverter.class)
    private LocalDateTime date1;

}
