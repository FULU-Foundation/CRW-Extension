# https://consumerrights.wiki/Special:CargoTables

import argparse
import csv
import json
import sys
import os

import requests

wiki_username = os.environ.get("WIKI_USERNAME")
wiki_botname = os.environ.get("WIKI_BOTNAME")
username = f"{wiki_username}@{wiki_botname}"
wiki_password = os.environ.get("WIKI_PASSWORD")
api_url = "https://consumerrights.wiki/api.php"

session = requests.session()

# Get CSRF Token
params = {"action": "query", "format": "json", "meta": "tokens", "type": "login"}
res = session.get(url=api_url, params=params)
token = res.json()["query"]["tokens"]["logintoken"]

# Authenticate
auth_data = {
    "action": "login",
    "format": "json",
    "lgname": username,
    "lgpassword": wiki_password,
    "lgtoken": token,
}
res = session.post(url=api_url, data=auth_data)


TABLE_FIELDS = {
    "Company": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Description",
        "Industry",
        "ParentCompany",
        "Type",
        "Website",
    ],
    "Incident": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Company",
        "StartDate",
        "EndDate",
        "Status",
        "ProductLine",
        "Product",
        "Type",
        "Description",
    ],
    "Product": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Category",
        "Company",
        "Description",
        "ProductLine",
        "Website",
    ],
    "ProductLine": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Category",
        "Company",
        "Description",
        "Website",
    ],
}

PAGE_SIZE = 500  # Max limit per MediaWiki request


def query_all_pages(table, where_clause=None):
    if table not in TABLE_FIELDS:
        raise ValueError(f"Unsupported table: {table}")

    fields = TABLE_FIELDS[table]
    offset = 0
    all_data = []

    while True:
        params = {
            "action": "cargoquery",
            "format": "json",
            "tables": table,
            "fields": ",".join(fields),
            # "limit": PAGE_SIZE,
            "offset": offset,
        }
        if where_clause:
            params["where"] = where_clause

        response = session.get(api_url, params=params)
        response.raise_for_status()
        print(response.text)
        data = response.json().get("cargoquery", [])
        print(data)
        if not data:
            break
        all_data.extend([entry["title"] for entry in data])
        offset += PAGE_SIZE

    return all_data


def export_to_json(data, filepath):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(
        f"Exported {len(data) if isinstance(data, list) else sum(len(v) for v in data.values())} records to {filepath}"
    )


def export_to_csv(data, filepath):
    if not data:
        print(f"No data to export to {filepath}.")
        return
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"Exported {len(data)} records to {filepath}")


def export_table(table, where, out_format, out_dir):
    data = query_all_pages(table, where_clause=where)
    filename = os.path.join(out_dir, f"{table}.{out_format}")

    if out_format == "json":
        export_to_json(data, filename)
    elif out_format == "csv":
        export_to_csv(data, filename)


def export_all_tables_combined(out_format, out_dir, where_clause=None):
    combined_data = {}
    total_records = 0

    for table in TABLE_FIELDS.keys():
        print(f"📦 Fetching table: {table}")
        data = query_all_pages(table, where_clause)
        combined_data[table] = data
        total_records += len(data)

    filename = os.path.join(out_dir, f"all_cargo_combined.{out_format}")

    if out_format == "json":
        export_to_json(combined_data, filename)
    elif out_format == "csv":
        # Flatten data and add _table column
        flattened = []
        for table_name, records in combined_data.items():
            for rec in records:
                rec_with_table = dict(rec)
                rec_with_table["_table"] = table_name
                flattened.append(rec_with_table)
        export_to_csv(flattened, filename)

    print(f"\nExported total {total_records} records combined to {filename}")


def main():
    parser = argparse.ArgumentParser(
        description="Query ConsumerRights.wiki Cargo tables"
    )
    parser.add_argument(
        "--table",
        required=False,
        choices=list(TABLE_FIELDS.keys()) + ["all"],
        help="Table to query (or 'all' for all tables)",
        default="all",
    )
    parser.add_argument("--where", help="Optional WHERE clause")
    parser.add_argument(
        "--format",
        choices=["json", "csv"],
        required=False,
        help="Export format",
        default="json",
    )
    parser.add_argument(
        "--output-dir", default=".", help="Directory to save exported files"
    )

    args = parser.parse_args()

    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)

    if args.table == "all":
        try:
            export_all_tables_combined(
                args.format, args.output_dir, where_clause=args.where
            )
        except Exception as e:
            print(f"❌ Error exporting combined tables: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        try:
            print(f"📦 Fetching table: {args.table}")
            export_table(args.table, args.where, args.format, args.output_dir)
        except Exception as e:
            print(f"❌ Error with table '{args.table}': {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
