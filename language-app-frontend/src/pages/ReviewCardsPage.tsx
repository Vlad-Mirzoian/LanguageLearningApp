import { useEffect, useState } from "react";

const ReviewCardsPage: React.FC = () => {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Review Your Lessons
        </h2>
        {user && (
          <p className="text-center text-gray-600 mb-4">Hello, {user.email}!</p>
        )}
        <div className="text-center text-gray-600">
          <p>Start reviewing your words and phrases here.</p>
          <p className="mt-2">
            Coming soon: Flashcards and practice exercises.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCardsPage;
