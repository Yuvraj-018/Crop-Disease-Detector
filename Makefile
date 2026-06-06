.PHONY: dev down logs migrate seed test lint shell-db build

dev:
	docker-compose up --build

down:
	docker-compose down

logs:
	docker-compose logs -f

migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python -m app.seeds.run_seeds

test:
	docker-compose exec backend pytest tests/ -v

lint:
	docker-compose exec backend ruff check app/
	docker-compose exec backend black --check app/

shell-db:
	docker-compose exec postgres psql -U cropguard

build:
	docker-compose -f docker-compose.prod.yml build
