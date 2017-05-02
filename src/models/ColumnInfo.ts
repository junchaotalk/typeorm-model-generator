/**
 * ColumnInfo
 */
interface ColumnInfo {
    name: string,
    default: string|null,
    is_nullable: boolean,
    ts_type: 'number' | 'string' | 'boolean'| 'Date',
    sql_type: "string" | "text" | "number" | "integer" | "int" | "smallint" | "bigint" |
    "float" | "double" | "decimal" | "date" | "time" | "datetime" | "boolean" | "json" |
    "char" | "longtext" | "tinyint" | "varchar",
    char_max_lenght: number|null,
    isPrimary:boolean,
    isCreateTime:boolean,
    isUpdateTime:boolean,
    isVersion:boolean,
    isSpecialColumn:boolean,
    numericPrecision:number|null,
    numericScale:number|null
}


