from app import app


@app.flask.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    from backend.models.User import User
    from backend.models.Interaction import Interaction
    from backend.models.Battle import Battle

    with app.flask.app_context():
        app.db.drop_all()
        print("Run create all")
        app.db.create_all()
    print("Initialized the database.")