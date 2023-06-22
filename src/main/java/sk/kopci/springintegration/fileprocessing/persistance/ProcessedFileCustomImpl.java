package sk.kopci.springintegration.fileprocessing.persistance;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Pageable;
import sk.kopci.springintegration.fileprocessing.persistance.dtos.ProcessedFilesResult;
import sk.kopci.springintegration.fileprocessing.services.dtos.Filter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static sk.kopci.springintegration.fileprocessing.utils.Constants.*;

public class ProcessedFileCustomImpl implements ProcessedFileCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public ProcessedFilesResult findByCustomQuery(Filter filter, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        CriteriaQuery<ProcessedFile> query = cb.createQuery(ProcessedFile.class);
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);

        Root<ProcessedFile> root = query.from(ProcessedFile.class);
        Root<ProcessedFile> countRoot = countQuery.from(ProcessedFile.class);

        List<Predicate> predicates = new ArrayList<>();
        List<Predicate> countPredicates = new ArrayList<>();

        if (!filter.getValues().areEmpty()) {

            // string1
            if (filter.getValues().getString1() != null) {
                Expression<String> fileNameExpression = cb.lower(root.get(PROPERTY_STRING1));
                String searchValue = '%' + filter.getValues().getString1().toLowerCase() + '%';
                predicates.add(cb.like(fileNameExpression, searchValue));
                countPredicates.add(cb.like(countRoot.get(PROPERTY_STRING1), '%' + filter.getValues().getString1() + '%'));
            }

            // string2
            if (filter.getValues().getString2() != null) {
                Expression<String> fileNameExpression = cb.lower(root.get(PROPERTY_STRING2));
                String searchValue = '%' + filter.getValues().getString2().toLowerCase() + '%';
                predicates.add(cb.like(fileNameExpression, searchValue));
                countPredicates.add(cb.like(countRoot.get(PROPERTY_STRING2), '%' + filter.getValues().getString2() + '%'));
            }

            // from
            if (filter.getValues().getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get(PROPERTY_DATE1), filter.getValues().getFrom()));
                countPredicates.add(cb.greaterThanOrEqualTo(countRoot.<LocalDateTime>get(PROPERTY_DATE1), filter.getValues().getFrom()));
            } else {
                /*
                Additional request: default view should be 96 hours old for every processedFile.
                If from/to filter values are null, show only max. 96 hours old history of processing.

                Implementation:

                LocalDateTime fourDaysAgo = LocalDateTime.now().minusDays(4);
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get(PROPERTY_DATE1), fourDaysAgo));
                countPredicates.add(cb.greaterThanOrEqualTo(countRoot.<LocalDateTime>get(PROPERTY_DATE1), fourDaysAgo));
                 */
            }

            // to
            if (filter.getValues().getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDateTime>get(PROPERTY_DATE1), filter.getValues().getTo()));
                countPredicates.add(cb.lessThanOrEqualTo(countRoot.<LocalDateTime>get(PROPERTY_DATE1), filter.getValues().getTo()));
            }

            // query
            query.select(root).where(cb.and(predicates.toArray(new Predicate[predicates.size()])));

            // count query
            countQuery.select(cb.count(countRoot)).where(countPredicates.toArray(new Predicate[countPredicates.size()])).distinct(true);

        } else {
            countQuery.select(cb.count(countRoot));
        }

        // count for pagination
        Long count = entityManager.createQuery(countQuery).getSingleResult();

        /*
        Sort

        For a server-side sort a specific string value is required,
        i.e. "date1_asc" - sort string consists of 2 substrings;
            - first is a property name
            - second is sorting order (asc/desc)
         */
        if (filter.getSort() != null) {
            String[] s = filter.getSort().split("_");
            query.orderBy(s[1].equals("asc") ? cb.asc(root.get(s[0])) : cb.desc(root.get(s[0])));
        } else {
            // default: descending sort by date1
            query.orderBy(cb.desc(root.get(PROPERTY_DATE1)));
        }

        return new ProcessedFilesResult(
                entityManager
                        .createQuery(query)
                        .setFirstResult((int) pageable.getOffset())
                        .setMaxResults(pageable.getPageSize())
                        .getResultList(),
                count
        );
    }

}
