import * as migration_20260719_144734_add_tire_selection_fields from './20260719_144734_add_tire_selection_fields';
import * as migration_20260719_155015_add_request_selection_context from './20260719_155015_add_request_selection_context';
import * as migration_20260726_041541_add_cart_sessions from './20260726_041541_add_cart_sessions';
import * as migration_20260726_094343_add_tbr_catalog_schema from './20260726_094343_add_tbr_catalog_schema';
import * as migration_20260726_105520_bizon_refactor_baseline from './20260726_105520_bizon_refactor_baseline';
import * as migration_20260727_015500_tire_catalog_manager_ux from './20260727_015500_tire_catalog_manager_ux';

export const migrations = [
  {
    up: migration_20260719_144734_add_tire_selection_fields.up,
    down: migration_20260719_144734_add_tire_selection_fields.down,
    name: '20260719_144734_add_tire_selection_fields',
  },
  {
    up: migration_20260719_155015_add_request_selection_context.up,
    down: migration_20260719_155015_add_request_selection_context.down,
    name: '20260719_155015_add_request_selection_context',
  },
  {
    up: migration_20260726_041541_add_cart_sessions.up,
    down: migration_20260726_041541_add_cart_sessions.down,
    name: '20260726_041541_add_cart_sessions',
  },
  {
    up: migration_20260726_094343_add_tbr_catalog_schema.up,
    down: migration_20260726_094343_add_tbr_catalog_schema.down,
    name: '20260726_094343_add_tbr_catalog_schema',
  },
  {
    up: migration_20260726_105520_bizon_refactor_baseline.up,
    down: migration_20260726_105520_bizon_refactor_baseline.down,
    name: '20260726_105520_bizon_refactor_baseline'
  },
  {
    up: migration_20260727_015500_tire_catalog_manager_ux.up,
    down: migration_20260727_015500_tire_catalog_manager_ux.down,
    name: '20260727_015500_tire_catalog_manager_ux'
  },
];
