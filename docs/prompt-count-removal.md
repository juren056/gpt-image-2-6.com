# Prompt count removal

Authorized by the owner on 2026-10-17.

## Scope

The public site no longer displays prompt inventory totals or category/result
counts. This applies to:

- the homepage showcase link and carousel position counter;
- the public Prompt Library heading, category chips, favorites chip and result
  status;
- the reusable image/video prompt library media tabs, category navigation and
  result summary.

The catalog remains complete and searchable. Filters, favorites, pagination,
carousel controls and prompt handoff behavior are unchanged. Loading and error
status messages remain visible without exposing inventory quantities.

## Validation

The count-bearing render paths were removed from source and all 18 locale files
retain matching keys. Responsive review covers the homepage carousel and Prompt
Library at mobile and desktop widths. Prompt catalog integrity is still checked
against the full source dataset.
