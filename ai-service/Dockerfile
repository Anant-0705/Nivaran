FROM python:3.10-slim

WORKDIR /app

# install system deps
RUN apt-get update && apt-get install -y build-essential libgl1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV MODEL_PATH=/app/models/best.pt
ENV CONF_THRESHOLD=0.6

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
