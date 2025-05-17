# Ingestion Onboarding

A Django web application for onboarding and managing data sources for the ingestion pipeline.

## Features

- Data source management (create, read, update, delete)
- Support for different types of data sources (websites, APIs, files, databases)

## Setup

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bridge-core/ingestion-module/ingestion-onboarding
```

2. Create and activate a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env file with your configuration
```

5. Run migrations
```bash
python manage.py migrate
```

6. Create a superuser (admin)
```bash
python manage.py createsuperuser
```

7. Run the development server
```bash
python manage.py runserver
```

8. Access the application at http://127.0.0.1:8000/

## Usage

1. Log in with your superuser credentials
2. Add data sources through the interface
3. View and manage existing data sources

## Development

### Running Tests
```bash
python manage.py test
```

## License

[License information] 