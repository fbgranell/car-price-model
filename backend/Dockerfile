FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY src ./src
COPY models ./models

RUN pip install --no-cache-dir .

EXPOSE 7860

CMD ["uvicorn", "car_price_model.api.app:app", "--host", "0.0.0.0", "--port", "7860"]
