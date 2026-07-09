import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/src/test/test-utils";
import PasswordChangeForm from "./PasswordChangeForm";

function fillForm(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("현재 비밀번호"), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText("새 비밀번호"), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText("새 비밀번호 확인"), {
    target: { value: confirm },
  });
}

describe("PasswordChangeForm", () => {
  it("비밀번호 변경 성공 시 성공 메시지를 보여준다", async () => {
    renderWithProviders(<PasswordChangeForm />);

    fillForm("OldPass123!", "NewPass456!", "NewPass456!");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      await screen.findByText("비밀번호가 변경되었습니다.")
    ).toBeInTheDocument();
  });

  it("새 비밀번호 확인이 다르면 제출하지 않고 에러를 보여준다", async () => {
    renderWithProviders(<PasswordChangeForm />);

    fillForm("OldPass123!", "NewPass456!", "Different789!");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      await screen.findByText("새 비밀번호가 일치하지 않습니다.")
    ).toBeInTheDocument();
  });

  it("현재 비밀번호가 틀리면 서버 에러 메시지를 보여준다", async () => {
    renderWithProviders(<PasswordChangeForm />);

    fillForm("WrongPass999!", "NewPass456!", "NewPass456!");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    await waitFor(() =>
      expect(
        screen.getByText("Current password does not match")
      ).toBeInTheDocument()
    );
  });
});
