# Reina-Valera 1909 source

Faith & Me bundles the Spanish Reina-Valera 1909 (RV1909) from the eBible public-domain USFM release:

- Source: https://ebible.org/Scriptures/spaRV1909_usfm.zip
- Download page: https://ebible.org/spaRV1909/
- Details page: https://ebible.org/find/details.php?id=spaRV1909
- CrossWire module record: https://crosswire.org/sword/copyright/ModInfoCopyright.jsp?modName=SpaRV

The eBible details page marks `spaRV1909` as public domain. CrossWire's `SpaRV` module record identifies the text as `La Santa Biblia Reina-Valera (1909)` and lists its distribution license as public domain.

The checked-in `data/rv1909.json` was generated from the USFM archive with:

```sh
node scripts/import-rv1909.mjs /tmp/spaRV1909_usfm data/rv1909.json
```

The importer removes USFM formatting, footnotes, cross references, word markers, and Strong's metadata while preserving verse text and canonical reference coordinates. It does not generate, translate, or paraphrase Scripture.

Some source files include blank USFM verse markers at chapter endings or versification boundaries. The importer skips those blank records so the app never renders empty verse rows.

Validation is run with:

```sh
node scripts/validate-scripture-dataset.mjs data/rv1909.json
```

The current generated corpus validates as 66 books, 1,189 chapters, 31,084 non-empty verse records, no duplicate references, and no malformed records.
