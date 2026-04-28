# Standard units

Standard unit defines a unit that is used by `standard` portion size method estimation.

## Properties

- `ID` - unique string ID (historically [snake_case](https://en.wikipedia.org/wiki/Snake_case) naming convention was used

- `Name` - Standard unit name

- `Estimate in` - Localized `estimate in` text

- `How many` - Localized `how many` text

- `Icon` - Icon for the standard unit

:::tip
Intake24 is using [iconify](https://icon-sets.iconify.design/) icons. Any icon from the iconify collection can be used as food icon. However not all icons are being bundled with Intake24, so if you want to use an icon that is not bundled, the technical team will need to be contacted to add the icon to the bundle.
:::

## Deletion

:::warning
When deleting a standard unit, make sure that it is not assigned to any of the portion size methods.
:::
