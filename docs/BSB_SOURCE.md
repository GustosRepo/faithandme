# Berean Standard Bible source

Faith & Me bundles the Berean Standard Bible (BSB) from the official Berean Bible USFM download:

- Source: https://bereanbible.com/bsb_usfm.zip
- Download page: https://berean.bible/downloads.htm
- Terms: https://berean.bible/terms.htm

The official terms state that the Berean Bible texts were dedicated to the public domain under CC0 1.0 on April 30, 2023, and that all uses are freely permitted, including free and commercial resources. The terms also provide an appreciated, non-required attribution notice.

The checked-in `data/bsb.json` was generated from the official USFM archive with `node scripts/import-bsb.mjs`. The importer removes USFM formatting and footnote markers while preserving the verse text and canonical reference coordinates. It does not generate or paraphrase Scripture.

Validation is run with `node scripts/validate-bsb.mjs data/bsb.json` and checks the 66-book corpus, duplicate references, empty text, and malformed verse records.