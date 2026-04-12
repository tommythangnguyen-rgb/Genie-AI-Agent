"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePostSignIn = async () => {
    // On askGenie pages (or genie127.com root), just refresh to reflect authenticated state
    const askGeniePages = ["/account", "/aid-agent", "/pricing", "/about", "/support", "/legal", "/institutions"];
    const isGenieDomain = typeof window !== "undefined" &&
      (window.location.hostname === "genie127.com" || window.location.hostname === "www.genie127.com");
    const isAskGeniePage = isGenieDomain || (typeof window !== "undefined" && askGeniePages.some(
      (p) => window.location.pathname === p || window.location.pathname.startsWith(p + "/")
    ));
    if (isAskGeniePage) {
      // Full navigation remounts the client component and re-triggers useEffect/fetchStatus
      window.location.href = window.location.pathname;
      return;
    }

    // UIGen flow: get/create project and redirect
    const anonWork = getAnonWorkData();

    if (anonWork && anonWork.messages.length > 0) {
      const project = await createProject({
        name: `Design from ${new Date().toLocaleTimeString()}`,
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });

      clearAnonWork();
      router.push(`/${project.id}`);
      return;
    }

    const projects = await getProjects();

    if (projects.length > 0) {
      router.push(`/${projects[0].id}`);
      return;
    }

    const newProject = await createProject({
      name: `New Design #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });

    router.push(`/${newProject.id}`);
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInAction(email, password);

      if (result.success) {
        await handlePostSignIn();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signUpAction(email, password);

      if (result.success && !result.pendingVerification) {
        await handlePostSignIn();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    isLoading,
  };
}
