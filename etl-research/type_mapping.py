"""
SQL Server → PostgreSQL type translator.

Rules (matching the sales-ETL conventions already established):

  nvarchar(-1) / nvarchar(MAX) / varchar(MAX) / text / ntext   -> text
  nvarchar(n) / varchar(n) / char(n) / nchar(n)                -> text
  datetime / datetime2 / smalldatetime                         -> timestamp (naive, IST in source)
  datetimeoffset                                               -> timestamptz
  date                                                         -> date
  time                                                         -> time
  float / real                                                 -> double precision
  decimal / numeric / money / smallmoney                       -> numeric (preserve precision/scale)
  int / smallint / tinyint                                     -> integer
  bigint                                                       -> bigint
  bit                                                          -> boolean
  uniqueidentifier                                             -> uuid
  varbinary / binary / image                                   -> bytea
  xml                                                          -> text
  sql_variant / hierarchyid / geography / geometry             -> text   (best-effort)

Identifiers are lowercased in Postgres and always quoted (some columns are
reserved words: STATE, CITY, PHONE, USER, ...).
"""

from __future__ import annotations

# Postgres reserved words / commonly conflicting identifiers — for awareness;
# we always double-quote every identifier so this is informational only.
PG_RESERVED_HINT = {
    "user", "session", "select", "from", "where", "table", "order", "group",
    "state", "city", "phone", "type", "name", "key", "value", "default",
    "primary", "foreign", "references", "check", "constraint",
}


def translate_type(sql_type: str, max_length: int | None, precision: int | None, scale: int | None) -> str:
    """
    Translate one SQL Server type to a Postgres column type.

    Args:
        sql_type:    the system_type_name reported by sys.types, lowercased
        max_length:  bytes (NOT characters) for *char/*binary types; -1 = MAX
        precision:   for decimal/numeric
        scale:       for decimal/numeric
    """
    t = (sql_type or "").lower().strip()

    if t in ("nvarchar", "varchar", "char", "nchar", "text", "ntext", "xml"):
        return "text"

    if t in ("datetime", "datetime2", "smalldatetime"):
        return "timestamp"

    if t == "datetimeoffset":
        return "timestamptz"

    if t == "date":
        return "date"

    if t == "time":
        return "time"

    if t in ("float", "real"):
        return "double precision"

    if t in ("decimal", "numeric"):
        if precision and scale is not None:
            return f"numeric({precision},{scale})"
        return "numeric"

    if t in ("money", "smallmoney"):
        return "numeric(19,4)"

    if t in ("int",):
        return "integer"

    if t == "smallint":
        return "smallint"

    if t == "tinyint":
        return "smallint"  # Postgres has no tinyint

    if t == "bigint":
        return "bigint"

    if t == "bit":
        return "boolean"

    if t == "uniqueidentifier":
        return "uuid"

    if t in ("varbinary", "binary", "image", "timestamp", "rowversion"):
        # NB: SQL Server "timestamp" is a binary row-version, not a date.
        return "bytea"

    if t in ("sql_variant", "hierarchyid", "geography", "geometry"):
        return "text"

    # Unknown — be loud rather than silent. The introspect output should
    # surface anything that ever lands here so we can extend the map.
    return f"text /* TODO: unknown source type '{sql_type}' */"


def pg_ident(name: str) -> str:
    """Lowercase + double-quote a Postgres identifier."""
    return '"' + name.lower().replace('"', '""') + '"'


def mssql_ident(name: str) -> str:
    """Bracket-quote a SQL Server identifier (preserves original case)."""
    return "[" + name.replace("]", "]]") + "]"
