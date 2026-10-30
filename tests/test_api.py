import unittest
import os
import sys

sys.path.insert(0, '/home/karl/homelab/karl_tasks')
from fastapi.testclient import TestClient
import app

TEST_DB_PATH = os.path.expanduser('~/homelab/karl_tasks/test_tasks.db')

class TestTodoAPI(unittest.TestCase):
    def setUp(self):
        self.original_db = app.DB_PATH
        app.DB_PATH = TEST_DB_PATH
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        app.init_db()
        self.client = TestClient(app.app)

    def tearDown(self):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        app.DB_PATH = self.original_db

    def test_empty_todos(self):
        res = self.client.get("/api/todos")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), [])

    def test_create_todo_success(self):
        payload = {
            "title": "Tugas Logika Informatika 2",
            "category": "Kuliah",
            "priority": "Tinggi",
            "deadline": "2026-10-25"
        }
        res = self.client.post("/api/todos", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["title"], "Tugas Logika Informatika 2")
        self.assertEqual(data["category"], "Kuliah")
        self.assertEqual(data["priority"], "Tinggi")
        self.assertFalse(data["completed"])
        self.assertIn("id", data)

    def test_create_todo_empty_title_fails(self):
        res = self.client.post("/api/todos", json={"title": "   "})
        self.assertEqual(res.status_code, 400)

    def test_update_todo_status(self):
        r1 = self.client.post("/api/todos", json={"title": "Tugas 1", "category": "Kuliah"})
        todo_id = r1.json()["id"]

        r2 = self.client.patch(f"/api/todos/{todo_id}", json={"completed": True})
        self.assertEqual(r2.status_code, 200)

        r3 = self.client.get("/api/todos")
        self.assertTrue(r3.json()[0]["completed"])

    def test_delete_todo(self):
        r1 = self.client.post("/api/todos", json={"title": "Hapus saya"})
        todo_id = r1.json()["id"]

        r2 = self.client.delete(f"/api/todos/{todo_id}")
        self.assertEqual(r2.status_code, 200)

        r3 = self.client.get("/api/todos")
        self.assertEqual(len(r3.json()), 0)

if __name__ == '__main__':
    unittest.main()
