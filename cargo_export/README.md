# Cargo Exports

## How run locally

1. Create a bot in the Wiki [here](https://consumerrights.wiki/w/Special:BotPasswords)

> [!NOTE]
> Make sure that the bot has permissions to:
>
> `Create, query and delete data through the Cargo extension`

2. Create a copy of the `.env.sample` file but with your username and your bot's name and password
3. Configure a Python virtual environment and install any dependencies necessary

```shell
pip install -r requirements-dev.txt
```

4. Run the script `export.py`

```shell
dotenv run -- python export.py
```
