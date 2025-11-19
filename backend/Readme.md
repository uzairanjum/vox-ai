# create virtual environment
python -m venv .venv
 
# activate environment
source ./.venv/Scripts/activate (window)
source ./.venv/bin/activate (macos)

# install dependencies
pip add poetry
poetry install

# start application
uvicorn main:app --port=8080 --reload
