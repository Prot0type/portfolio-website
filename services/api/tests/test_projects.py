def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_create_list_and_update_project(client):
    create_payload = {
        "title": "Case Study",
        "project_short_name": "Case Study",
        "description": "Responsive redesign with animated interactions.",
        "tags": ["nextjs", "aws"],
        "category": "Work",
        "project_date": "2026-02-08",
        "thumbnail": {"key": "thumb-1", "url": "/images/project-1.svg", "alt": "thumbnail"},
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
        json={"status": "published", "title": "Case Study Updated", "project_short_name": "Case Study Updated"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "published"
    assert update_response.json()["project_slug"] == "case-study-updated"

    by_slug_response = client.get("/api/projects/by-slug/case-study-updated")
    assert by_slug_response.status_code == 200
    assert by_slug_response.json()["project_id"] == project_id

    list_response = client.get("/api/projects?status_filter=published")
    assert list_response.status_code == 200
    assert any(item["project_id"] == project_id for item in list_response.json())


def test_delete_project(client):
    create_response = client.post(
        "/api/projects",
        json={
            "title": "Delete Me",
            "project_short_name": "Delete Me",
            "description": "Temporary entry",
            "tags": ["cleanup"],
            "category": "Personal",
            "project_date": "2026-01-01",
            "thumbnail": {"key": "thumb-2", "url": "/images/project-2.svg", "alt": "thumbnail"},
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
            "project_short_name": "No Primary",
            "description": "Should fail",
            "tags": [],
            "category": "College",
            "project_date": "2026-01-01",
            "thumbnail": {"key": "thumb-3", "url": "/images/project-3.svg", "alt": "thumbnail"},
            "images": [],
            "status": "draft",
            "sort_order": 0,
            "extra": {},
        },
    )
    assert create_response.status_code == 422


def test_short_name_must_be_unique(client):
    first = client.post(
        "/api/projects",
        json={
            "title": "Unique One",
            "project_short_name": "Design Sprint",
            "description": "First project",
            "tags": ["ux"],
            "category": "Work",
            "project_date": "2026-02-01",
            "thumbnail": {"key": "thumb-unique-1", "url": "/images/project-1.svg", "alt": "thumbnail"},
            "images": [],
            "status": "draft",
            "sort_order": 1,
            "extra": {},
        },
    )
    assert first.status_code == 201

    duplicate = client.post(
        "/api/projects",
        json={
            "title": "Unique Two",
            "project_short_name": "Design   Sprint",
            "description": "Second project",
            "tags": ["ui"],
            "category": "Work",
            "project_date": "2026-02-02",
            "thumbnail": {"key": "thumb-unique-2", "url": "/images/project-2.svg", "alt": "thumbnail"},
            "images": [],
            "status": "draft",
            "sort_order": 2,
            "extra": {},
        },
    )
    assert duplicate.status_code == 409


def test_short_name_rejects_symbols(client):
    invalid = client.post(
        "/api/projects",
        json={
            "title": "Invalid Short Name",
            "project_short_name": "Bad@Name!",
            "description": "Invalid characters should fail",
            "tags": ["ux"],
            "category": "Personal",
            "project_date": "2026-02-03",
            "thumbnail": {"key": "thumb-invalid", "url": "/images/project-1.svg", "alt": "thumbnail"},
            "images": [],
            "status": "draft",
            "sort_order": 1,
            "extra": {},
        },
    )
    assert invalid.status_code == 422


def test_site_content_defaults_and_update(client):
    initial = client.get("/api/site-content")
    assert initial.status_code == 200
    initial_payload = initial.json()
    assert initial_payload["bio_main"]
    assert initial_payload["bio_secondary"]

    updated = client.put(
        "/api/site-content",
        json={
            "bio_main": "Ishani creates thoughtful product journeys.",
            "bio_secondary": "Open to collaborations and design conversations.",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["bio_main"] == "Ishani creates thoughtful product journeys."
    assert updated.json()["bio_secondary"] == "Open to collaborations and design conversations."

    verify = client.get("/api/site-content")
    assert verify.status_code == 200
    assert verify.json()["bio_main"] == "Ishani creates thoughtful product journeys."
