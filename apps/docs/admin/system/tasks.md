# Tasks

Tasks resource allows to schedule repeatable jobs or run one-off jobs.

## Properties

- `Name` - Unique string within `tasks` records

- `Job` - Valid job from provided list

- `CRON` - Valid `cron` entry to be used for scheduling

- `Active` - Scheduler `on` / `off` status

- `Description` - Free text, any details about the particular task

- `Task parameters` - Additional job specific parameters

## Manual task trigger

Task can be triggered as one-off job using `trigger job` button on `detail` / `edit` tabs.
