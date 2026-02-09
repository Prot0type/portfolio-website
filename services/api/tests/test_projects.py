def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_create_list_and_update_project(client):
    create_payload = {
        "title": "Case Study",
        "description": "Responsive redesign with animated interactions.",
        "tags": ["nextjs", "aws"],
        "category": "Work",
        "project_date": "2026-02-08",
        "images": [{"key": "placeholder-1", "url": "/images/project-1.svg", "alt": "placeholder"}],
        "is_highlighted": True,
        "status": "draft",
        "sort_order": 2,
        "extra": {"client": "Internal"},
    }
    create_response = client.post("/api/projects", json=create_payload)
    assert create_response.status_code == 201
    project = create_response.json()
    project_id = project["project_id"]

    get_response = client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Case Study"

    update_response = client.put(
        f"/api/projects/{project_id}",
        json={"status": "published", "title": "Case Study Updated"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "published"

    list_response = client.get("/api/projects?status_filter=published")
    assert list_response.status_code == 200
    assert any(item["project_id"] == project_id for item in list_response.json())


def test_delete_project(client):
    create_response = client.post(
        "/api/projects",
        json={
            "title": "Delete Me",
            "description": "Temporary entry",
            "tags": ["cleanup"],
            "category": "Personal",
            "project_date": "2026-01-01",
            "images": [],
            "status": "draft",
            "sort_order": 0,
            "extra": {},
        },
    )
    project_id = create_response.json()["project_id"]
    delete_response = client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/projects/{project_id}")
    assert missing_response.status_code == 404


def test_requires_primary_tag(client):
    create_response = client.post(
        "/api/projects",
        json={
            "title": "No Primary",
            "description": "Should fail",
            "tags": [],
            "category": "College",
            "project_date": "2026-01-01",
            "images": [],
            "status": "draft",
            "sort_order": 0,
            "extra": {},
        },
    )
    assert create_response.status_code == 422
